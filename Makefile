.PHONY: setup dev load-candidates seed-auth

setup:
	npm install
	npx supabase@2.119.0 start
	npx supabase@2.119.0 db reset
	node scripts/ensure-env.mjs
	npm run seed-auth
	npm run load-candidates

dev:
	npm run dev

load-candidates:
	npm run load-candidates

seed-auth:
	npm run seed-auth
