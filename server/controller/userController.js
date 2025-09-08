import mongoose from "mongoose";
import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  BadRequestError,
  NotFoundError,
  UnauthorisedError,
} from "../errors/customErrors.js";
import { expiresIn, JWT_SECRET, NODE_ENV } from "../config/env.js";
import { StatusCodes } from "http-status-codes";

export const getAllUsers = async (req, res, next) => {
  const users = await User.find({});
  if (users.length == 0) return next(new NotFoundError("no users available"));
  res.status(200).json({ users });
};
export const getUser = async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new BadRequestError("missing values"));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new BadRequestError("invalid id"));
  const user = await User.findById(id);
  if (!user) return next(new NotFoundError("No user found"));
  res.status(200).json({ user });
};
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return next(new BadRequestError("missing values"));
    // const exist = await User.findOne({ email: email });
    // if (exist) return next(new BadRequestError("email exsists"));
    const newUser = new User({ name, email, password });

    await newUser.save();
  } catch (error) {
    // console.log(error);
    return res.status(404).json({ msg: "error occoured" });
  }
  res.status(201).json({ msg: "user created" });
};
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new BadRequestError("missing id"));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new BadRequestError("invalid id"));
  const exists = await User.findById(id);
  if (!exists) return next(new NotFoundError("user not found"));
  await User.findByIdAndDelete(id);
  res.status(200).json({ msg: "user deleted" });
};
export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, email } = req.body;
  let { password } = req.body;
  if (!name || !id || !email)
    return next(new BadRequestError("missing values"));
  if (password) {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
  }
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new BadRequestError("invalid id"));
  const user = await User.findById(id);
  if (!user) return next(new NotFoundError("usser not found"));
  const updateUser = await User.findByIdAndUpdate(
    id,
    { name, email, password },
    { new: true }
  );
  res.status(200).json({ updateUser });
};

export const findUserByEmail = async (req, res, next) => {
  const { email } = req.query;
  if (!email) return next(new BadRequestError("email not provided"));
  const user = await User.findOne({ email: email });
  if (user) {
    res.status(200).json({ msg: "user found" });
  } else {
    res.status(404).json({ msg: "user not found" });
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      console.warn("Login failed: Missing email or password");
      return next(new BadRequestError("Email and password are required"));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`Login failed: No user found for email ${email}`);
      return next(new UnauthorisedError("Invalid credentials"));
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: Incorrect password for user ${email}`);
      return next(new UnauthorisedError("Invalid credentials"));
    }

    // Generate token
    let token;
    try {
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.expiresIn || "1d"
      });
    } catch (err) {
      console.error("JWT signing failed:", err.message);
      return next(new InternalServerError("Token generation failed"));
    }

    // Set cookie
    try {
      res.cookie("token", token, {
        httpOnly: false, // ⚠️ Consider switching to true in production
        secure: true,
        sameSite: "None", // ✅ lowercase 'sameSite'
        maxAge: 86400000
      });
    } catch (err) {
      console.error("Cookie setting failed:", err.message);
      return next(new InternalServerError("Failed to set authentication cookie"));
    }

    res.status(StatusCodes.OK).json({ msg: "Login successful" });
  } catch (err) {
    console.error("Unexpected login error:", err.message);
    next(new InternalServerError("Unexpected server error during login"));
  }
};

export const logout = async (req, res, next) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const verifyToken = async (req, res) => {
  const { token } = req.cookies;
  if (!token)
    return res.status(401).json({ message: "Unauthorized, token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(400).json({ message: "Invalid userId in token" });
    }

    req.userId = decoded.userId;
    res.status(200).json({ message: "Protected content", userId: req.userId });
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const findUserByEmailFromToken = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return next(new UnauthorisedError("Token missing"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "_id email user_name"
    );

    if (!user) return next(new NotFoundError("User not found"));

    res.status(StatusCodes.OK).json({
      email: user.email,
      user_name: user.user_name,
      userId: user._id, // ✅ This is the actual unique MongoDB ID
    });
  } catch (err) {
    return next(new UnauthorisedError("Invalid or expired token"));
  }
};
