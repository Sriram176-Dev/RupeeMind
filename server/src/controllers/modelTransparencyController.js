import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller to serve the validated ML model transparency report
 */
export async function getModelTransparencyReport(req, res, next) {
  try {
    const reportPath = path.resolve(__dirname, '../config/modelTransparencyReport.json');
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        success: false,
        error: 'Model transparency report not found.',
      });
    }

    const raw = fs.readFileSync(reportPath, 'utf-8');
    const data = JSON.parse(raw);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
