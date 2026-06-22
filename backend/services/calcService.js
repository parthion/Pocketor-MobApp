/**
 * Calculation Service
 * Sandboxed amortization & schedule engine.
 *
 * SAFETY: formulas are evaluated with a tiny whitelist AST walker
 * (no eval/new Function/vm). Only arithmetic ops and a fixed set of
 * Math functions are allowed. This prevents arbitrary server-side code exec.
 */

// ── Safe expression evaluator ────────────────────────────────────────────────

const ALLOWED_MATH = new Set(['floor', 'ceil', 'round', 'abs', 'min', 'max', 'pow', 'sqrt']);

function safeEval(expr, vars) {
  // Tokenise → parse → walk with whitelist
  const tokens = tokenise(expr);
  const ast    = parseExpr(tokens);
  return walkAST(ast, vars);
}

// --- Tokeniser ---
function tokenise(expr) {
  const re = /\s*(\d+\.?\d*|[A-Za-z_][A-Za-z0-9_.]*|\*\*|[+\-*/(),%^])\s*/g;
  const tokens = [];
  let m;
  while ((m = re.exec(expr)) !== null) tokens.push(m[1]);
  return tokens;
}

// --- Recursive descent parser ---
let _pos, _tokens;
function parseExpr(tokens) {
  _tokens = tokens; _pos = 0;
  return parseAddSub();
}
function peek()    { return _tokens[_pos]; }
function consume() { return _tokens[_pos++]; }
function parseAddSub() {
  let left = parseMulDiv();
  while (peek() === '+' || peek() === '-') {
    const op = consume();
    left = { op, left, right: parseMulDiv() };
  }
  return left;
}
function parseMulDiv() {
  let left = parseUnary();
  while (peek() === '*' || peek() === '/' || peek() === '%' || peek() === '**') {
    const op = consume();
    left = { op, left, right: parseUnary() };
  }
  return left;
}
function parseUnary() {
  if (peek() === '-') { consume(); return { op: 'neg', right: parsePrimary() }; }
  return parsePrimary();
}
function parsePrimary() {
  const t = consume();
  if (t === '(') { const v = parseAddSub(); consume(/* ) */); return v; }
  if (/^\d/.test(t)) return { num: parseFloat(t) };
  // function call e.g. Math.round(...)
  if (peek() === '(') {
    const fn = t.replace('Math.', '');
    if (!ALLOWED_MATH.has(fn)) throw new Error(`Disallowed function: ${fn}`);
    consume(); // (
    const args = [];
    while (peek() !== ')') { args.push(parseAddSub()); if (peek() === ',') consume(); }
    consume(); // )
    return { fn, args };
  }
  return { var: t };
}

// --- AST walker ---
function walkAST(node, vars) {
  if (node.num !== undefined) return node.num;
  if (node.var !== undefined) {
    const val = vars[node.var];
    if (val === undefined) throw new Error(`Unknown variable: ${node.var}`);
    return Number(val);
  }
  if (node.fn) return Math[node.fn](...node.args.map(a => walkAST(a, vars)));
  if (node.op === 'neg') return -walkAST(node.right, vars);
  const l = walkAST(node.left, vars);
  const r = walkAST(node.right, vars);
  switch (node.op) {
    case '+':  return l + r;
    case '-':  return l - r;
    case '*':  return l * r;
    case '/':  return l / r;
    case '%':  return l % r;
    case '**': return Math.pow(l, r);
    default: throw new Error(`Unknown operator: ${node.op}`);
  }
}

// ── Amortization engine ──────────────────────────────────────────────────────

/**
 * Calculate amortization schedule from a product config schema.
 *
 * @param {object} schema  - json_schema from product_configs
 * @param {object} inputs  - runtime values: { principal, startDate, ... }
 * @returns {{ summary, schedule }}
 */
function calculate(schema, inputs) {
  const calc   = schema.calculation || {};
  const vars   = { ...schema.defaults, ...inputs };

  // Resolve principal
  const principal = Number(vars.principal);
  if (!principal || principal <= 0) throw new Error('principal must be > 0');

  // Interest model: flat | reducing
  const model        = calc.interestModel || 'flat';
  const ratePerPeriod = Number(vars.interestPerHundred || vars.interestRate || 0) / 100;
  const installments  = Number(vars.noOfInstalls || vars.numInstallments || 1);

  let totalInterest, installmentAmount, totalAmount;

  if (model === 'flat') {
    // formula override or default flat calc
    if (calc.formulas && calc.formulas.totalInterest) {
      totalInterest = safeEval(calc.formulas.totalInterest, { ...vars, principal, ratePerPeriod, installments });
    } else {
      totalInterest = principal * ratePerPeriod;
    }
    totalAmount       = principal + totalInterest;
    installmentAmount = parseFloat((totalAmount / installments).toFixed(2));
  } else if (model === 'reducing') {
    // Reducing balance (EMI)
    const r = ratePerPeriod;
    const n = installments;
    if (r === 0) {
      installmentAmount = parseFloat((principal / n).toFixed(2));
    } else {
      installmentAmount = parseFloat((principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)).toFixed(2));
    }
    totalAmount   = installmentAmount * n;
    totalInterest = totalAmount - principal;
  } else {
    throw new Error(`Unknown interest model: ${model}`);
  }

  // Fee calculation
  let processingFee = 0;
  if (schema.fees && calc.formulas && calc.formulas.processingFee) {
    processingFee = safeEval(calc.formulas.processingFee, { ...vars, principal });
  }

  // Build schedule
  const lineType  = (vars.lineType || 'Daily').toLowerCase();
  const startDate = new Date(vars.startDate || Date.now());
  const schedule  = [];

  let balance = principal;
  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(startDate);
    if (lineType === 'daily')        dueDate.setDate(startDate.getDate() + i);
    else if (lineType === 'weekly')  dueDate.setDate(startDate.getDate() + i * 7);
    else                             dueDate.setMonth(startDate.getMonth() + i);

    let interest = 0, principalPart = installmentAmount;
    if (model === 'reducing') {
      interest       = parseFloat((balance * ratePerPeriod).toFixed(2));
      principalPart  = parseFloat((installmentAmount - interest).toFixed(2));
    }
    balance = parseFloat((balance - principalPart).toFixed(2));

    // Penalty on last missed installment (placeholder — real logic via rules engine)
    let penalty = 0;
    if (schema.penalties && i === installments && balance > 0) {
      penalty = parseFloat((balance * (Number(schema.penalties.ratePercent || 0) / 100)).toFixed(2));
    }

    schedule.push({
      installmentNo: i,
      dueDate:       dueDate.toISOString().slice(0, 10),
      principal:     model === 'reducing' ? principalPart : parseFloat((principal / installments).toFixed(2)),
      interest:      model === 'reducing' ? interest : parseFloat((totalInterest / installments).toFixed(2)),
      penalty,
      totalDue:      parseFloat((installmentAmount + penalty).toFixed(2)),
      balance:       Math.max(balance, 0),
    });
  }

  return {
    summary: {
      principal:        parseFloat(principal.toFixed(2)),
      interestModel:    model,
      totalInterest:    parseFloat(totalInterest.toFixed(2)),
      processingFee:    parseFloat(processingFee.toFixed(2)),
      totalAmount:      parseFloat((totalAmount + processingFee).toFixed(2)),
      installmentAmount,
      installments,
      lineType,
    },
    schedule,
  };
}

module.exports = { calculate, safeEval };
