"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = exports.regitserAsOrganizer = exports.deleteUser = exports.updateUser = void 0;
const userRepository_1 = require("../repositories/userRepository");
const baseResponse_1 = require("../utils/baseResponse");
const baseResponse_2 = require("../utils/baseResponse");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const updateUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { name, phoneNumber, avatarUrl, password } = req.body;
        let data = { name, phoneNumber, avatarUrl };
        if (password) {
            data.passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        const userRaw = await (0, userRepository_1.updateUser)(payload.userId, data);
        const user = {
            ...userRaw,
            passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
            avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
            phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
            googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: user }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        await (0, userRepository_1.deleteUser)(payload.userId);
        res.json((0, baseResponse_1.baseResponse)({ success: true }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.deleteUser = deleteUser;
const regitserAsOrganizer = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        if (!name || !email || !password)
            return res.status(400).json((0, baseResponse_2.errorResponse)('Missing fields'));
        const existing = await (0, userRepository_1.findUserByEmail)(email);
        if (existing)
            return res.status(409).json((0, baseResponse_2.errorResponse)('Email already registered'));
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userRaw = await (0, userRepository_1.createUser)({
            name,
            email,
            passwordHash,
            phoneNumber,
            role: 'ORGANIZER',
        });
        const user = {
            ...userRaw,
            passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
            avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
            phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
            googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: { user } }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.regitserAsOrganizer = regitserAsOrganizer;
const register = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        if (!name || !email || !password)
            return res.status(400).json((0, baseResponse_2.errorResponse)('Missing fields'));
        const existing = await (0, userRepository_1.findUserByEmail)(email);
        if (existing)
            return res.status(409).json((0, baseResponse_2.errorResponse)('Email already registered'));
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userRaw = await (0, userRepository_1.createUser)({
            name,
            email,
            passwordHash,
            phoneNumber,
        });
        const user = {
            ...userRaw,
            passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
            avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
            phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
            googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
        };
        // const token = signJwt({ userId: user.id, role: user.role });
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: { user } }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json((0, baseResponse_2.errorResponse)('Missing fields'));
        const userRaw = await (0, userRepository_1.findUserByEmail)(email);
        if (!userRaw || !userRaw.passwordHash)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Invalid credentials'));
        const user = {
            ...userRaw,
            passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
            avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
            phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
            googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
        };
        // passwordHash is checked above, but ensure type safety for bcrypt
        if (typeof user.passwordHash !== 'string') {
            return res.status(401).json((0, baseResponse_2.errorResponse)('Invalid credentials'));
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Invalid credentials'));
        const token = (0, jwt_1.signJwt)({ userId: user.id, role: user.role });
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: { user, token } }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.login = login;
