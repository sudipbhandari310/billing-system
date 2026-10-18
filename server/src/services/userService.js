import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

export const list = async ({ page = 1, limit = 20, search = '' }) => {
  const query = {};
  if (search) {
    const r = new RegExp(search, 'i');
    query.$or = [{ name: r }, { email: r }];
  }
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { total, page, limit, users };
};

export const getById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const update = async (id, { name, phone, role, isActive, password }) => {
  const update = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (role !== undefined) update.role = role;
  if (isActive !== undefined) update.isActive = isActive;
  if (password) update.password = password;

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  Object.assign(user, update);
  await user.save();
  return user;
};

export const remove = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  await user.deleteOne();
};