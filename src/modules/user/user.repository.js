import User from './user.model.js';

class UserRepository {
    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }

    async findUserByEmail(email) {
        return await User.findOne({ email });
    }

    async findUserByUsername(username) {
        return await User.findOne({ username });
    }

    async findUserById(id) {
        return await User.findById(id).select('-password');
    }

    async findAllUsers() {
        return await User.find().select('-password');
    }

    async findUsersByIds(userIds) {
        return await User.find({ _id: { $in: userIds } }).select('-password');
    }

    async updateUser(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    }
}

export default new UserRepository();
