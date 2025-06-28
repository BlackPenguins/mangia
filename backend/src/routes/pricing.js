import express from 'express';
import Tesseract, { createWorker } from 'tesseract.js';
import multer from 'multer';
import sharp from 'sharp';
import { checkAdminMiddleware } from './auth.js';
import fs from 'fs';
import path from 'path';


const router = express.Router();

export default router;
