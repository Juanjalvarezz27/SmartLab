const fs = require('fs');
const i4 = fs.readFileSync('public/fonts/inter-400.ttf').toString('base64');
const i7 = fs.readFileSync('public/fonts/inter-700.ttf').toString('base64');
const m9 = fs.readFileSync('public/fonts/montserrat-900.ttf').toString('base64');

const content = `export const inter400 = 'data:font/truetype;charset=utf-8;base64,${i4}';
export const inter700 = 'data:font/truetype;charset=utf-8;base64,${i7}';
export const montserrat900 = 'data:font/truetype;charset=utf-8;base64,${m9}';
`;

fs.writeFileSync('src/lib/fontsBase64.ts', content);
