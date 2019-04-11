import dotenv from 'dotenv';

const CONFIG = dotenv.config();

export default {
    MONGO: CONFIG.parsed.MONGO,
    SECRET: Array(CONFIG.parsed.SECRET),
    KOAPORT: CONFIG.parsed.KOAPORT,
    PROD: !!CONFIG.parsed.PROD,
    APPLICATIONSONPAGE: Number(CONFIG.parsed.APPLICATIONSONPAGE)
}