module.exports = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  }
};
