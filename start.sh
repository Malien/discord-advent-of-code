source .env
mkdir -p logs
mv logs/latest.log logs/$(date +%Y-%m-%d_%H-%M-%S).log
node out/index.js | tee logs/latest.log | pino-pretty -i pid,hostname

