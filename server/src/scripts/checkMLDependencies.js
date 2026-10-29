import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if Python is installed
 */
async function checkPython() {
  try {
    const { stdout } = await execAsync('python --version');
    console.log('[ML Setup] Python version:', stdout.trim());
    return true;
  } catch {
    try {
      const { stdout } = await execAsync('python3 --version');
      console.log('[ML Setup] Python version:', stdout.trim());
      return true;
    } catch {
      console.error('[ML Setup] Python is not installed. Please install Python 3.8+');
      return false;
    }
  }
}

/**
 * Check if uvicorn is installed
 */
async function checkUvicorn() {
  try {
    const { stdout } = await execAsync('uvicorn --version');
    console.log('[ML Setup] Uvicorn version:', stdout.trim());
    return true;
  } catch {
    console.log('[ML Setup] Uvicorn not found. Installing...');
    try {
      await execAsync('pip install uvicorn fastapi');
      console.log('[ML Setup] Uvicorn and FastAPI installed successfully');
      return true;
    } catch (error) {
      console.error('[ML Setup] Failed to install uvicorn:', error.message);
      return false;
    }
  }
}

/**
 * Check if ML requirements are installed
 */
async function checkMLRequirements() {
  try {
    const { stdout } = await execAsync('pip list | grep -E "(xgboost|scikit-learn|pandas|numpy)"');
    console.log('[ML Setup] ML packages installed:', stdout.trim());
    return true;
  } catch {
    console.log('[ML Setup] ML packages not found. Installing from requirements.txt...');
    try {
      await execAsync('pip install -r ../rupeemind-ml/requirements.txt', {
        cwd: process.cwd()
      });
      console.log('[ML Setup] ML requirements installed successfully');
      return true;
    } catch (error) {
      console.error('[ML Setup] Failed to install ML requirements:', error.message);
      return false;
    }
  }
}

/**
 * Main setup function
 */
export async function setupMLDependencies() {
  console.log('[ML Setup] Checking ML dependencies...');
  
  const pythonOk = await checkPython();
  if (!pythonOk) {
    console.log('[ML Setup] Skipping ML service due to missing Python');
    return false;
  }
  
  const uvicornOk = await checkUvicorn();
  if (!uvicornOk) {
    console.log('[ML Setup] Skipping ML service due to missing uvicorn');
    return false;
  }
  
  const requirementsOk = await checkMLRequirements();
  if (!requirementsOk) {
    console.log('[ML Setup] Skipping ML service due to missing ML packages');
    return false;
  }
  
  console.log('[ML Setup] All dependencies checked successfully');
  return true;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMLDependencies()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('[ML Setup] Error:', error);
      process.exit(1);
    });
}
