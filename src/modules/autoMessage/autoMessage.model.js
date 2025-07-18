import mongoose from 'mongoose';

const autoMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sendDate: {
    type: Date,
    required: true,
  },
  isQueued: {
    type: Boolean,
    default: false,
  },
  isSent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const AutoMessage = mongoose.model('AutoMessage', autoMessageSchema);

export default AutoMessage;
