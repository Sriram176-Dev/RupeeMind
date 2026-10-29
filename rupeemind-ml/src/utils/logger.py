import logging
import sys
from pathlib import Path
from src.utils.constants import LOGS_DIR


def get_logger(name: str = "RupeeMind", log_file: str = "rupeemind.log", level=logging.INFO) -> logging.Logger:
    """
    Returns a configured logger instance that writes to stdout and a file.
    """
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = LOGS_DIR / log_file

    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # File Handler
        file_handler = logging.FileHandler(file_path, encoding="utf-8")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger
