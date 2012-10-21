test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter dot

test-watch:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter list \
	--watch

redis-server:
	# we need a redis server to run, 
	# but we don't necessarily want to see the output
	redis-server > /dev/null 2>&1 &

.PHONY: test