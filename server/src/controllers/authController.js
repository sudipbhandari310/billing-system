import * as authService from '../services/authService.js';
import { send } from '../utils/ApiResponse.js';

export const register = async (req, res) => {
  const { user, token } = await authService.register(req.body);
  send(res, 201, { user, token }, 'Registered successfully');
};

export const login = async (req, res) => {
  const { user, token } = await authService.login(req.body);
  send(res, 200, { user, token }, 'Logged in successfully');
};

export const me = async (req, res) => {
  send(res, 200, { user: req.user }, 'Current user');
};