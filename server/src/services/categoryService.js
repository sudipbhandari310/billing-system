import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';

export const list = async ({ search = '' }) => {
  const query = {};
  if (search) query.name = new RegExp(search, 'i');
  const categories = await Category.find(query).sort({ name: 1 });
  return categories;
};

export const create = async (data) => Category.create(data);

export const update = async (id, data) => {
  const cat = await Category.findById(id);
  if (!cat) throw new ApiError(404, 'Category not found');
  Object.assign(cat, data);
  await cat.save();
  return cat;
};

export const remove = async (id) => {
  const cat = await Category.findById(id);
  if (!cat) throw new ApiError(404, 'Category not found');
  await cat.deleteOne();
};