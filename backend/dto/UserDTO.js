/**
 * Data Transfer Objects (DTOs)
 * Used to transfer data between client and server
 */

/**
 * DTO for user registration
 */
class RegisterUserDTO {
  constructor(email, name, phone, password) {
    this.email = email;
    this.name = name;
    this.phone = phone;
    this.password = password;
  }
}

/**
 * DTO for user login
 */
class LoginUserDTO {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}

/**
 * DTO for login response
 */
class LoginResponseDTO {
  constructor(user, token) {
    this.user = user;
    this.token = token;
  }
}

/**
 * DTO for user response (without sensitive data)
 */
class UserResponseDTO {
  constructor(id, email, name, phone, emailVerified, phoneVerified) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.phone = phone;
    this.emailVerified = emailVerified;
    this.phoneVerified = phoneVerified;
  }
}

/**
 * DTO for creating a collection
 */
class CreateCollectionDTO {
  constructor(
    name,
    description,
    startDate,
    frequency,
    interestRate,
    totalAmount
  ) {
    this.name = name;
    this.description = description;
    this.startDate = startDate;
    this.frequency = frequency;
    this.interestRate = interestRate;
    this.totalAmount = totalAmount;
  }
}

/**
 * DTO for updating a collection
 */
class UpdateCollectionDTO {
  constructor(name, description, status, endDate, interestRate) {
    this.name = name;
    this.description = description;
    this.status = status;
    this.endDate = endDate;
    this.interestRate = interestRate;
  }
}

module.exports = {
  RegisterUserDTO,
  LoginUserDTO,
  LoginResponseDTO,
  UserResponseDTO,
  CreateCollectionDTO,
  UpdateCollectionDTO,
};
