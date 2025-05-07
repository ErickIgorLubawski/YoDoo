import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const payload = {
  name: 'admin', // ou qualquer outro dado simbólico
  
};

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error('JWT_SECRET não está definido no .env');
  process.exit(1);
}

const token = jwt.sign(payload, secret, { expiresIn: '1d' });

console.log('Token gerado:\n');
console.log(token);
