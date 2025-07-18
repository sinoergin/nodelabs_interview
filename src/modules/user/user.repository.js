import User from './user.model.js';

class UserRepository {
  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  async findUserById(id) {
    return await User.findById(id).select('-password');
  }

  async findAllUsers() {
    return await User.find().select('-password');
  }
}

export default new UserRepository();
