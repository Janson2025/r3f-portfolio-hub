import records from '../../data/projects.json';
import settings from './sticker/params/stickers.json';
import { createCubeCatalog } from './catalogAdapter.js';
export default createCubeCatalog(records, settings);
