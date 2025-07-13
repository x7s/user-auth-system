import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { renderImageForm, generateImage } from '../controllers/runwareController.js';

const router = express.Router();

router.get('/generate', isAuthenticated, renderImageForm);
router.post('/generate', isAuthenticated, generateImage);

export default router;