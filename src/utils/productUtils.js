import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.resolve(__dirname, '..', 'data', 'products.json');

export const readProductsFromFile = () => {
    if (!fs.existsSync(productsFilePath)) {
        throw new Error(`File not found: ${productsFilePath}`);
    }
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(productsData);
};

export const writeProductsToFile = (products) => {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
};
