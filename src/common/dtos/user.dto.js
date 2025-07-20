class UserRegisterRequest {
    constructor(email, password, username) {
        this.email = email;
        this.password = password;
        this.username = username;
    }
}

class UserLoginRequest {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }
}

class UserResponse {
    constructor(user) {
        this.id = user._id;
        this.email = user.email;
        this.username = user.username;
        this.name = user.name;
        this.surname = user.surname;
        this.gender = user.gender;
        this.birthdate = user.birthdate;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}

class LoginResponse {
    constructor(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}

export { UserRegisterRequest, UserLoginRequest, UserResponse, LoginResponse };
