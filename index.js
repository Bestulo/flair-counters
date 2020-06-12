const rp = require('request-promise')
const fs = require('fs')
const { create, all } = require('mathjs')
const math = create(all)
math.config({ number: 'BigNumber', precision: 64 })

const { sum, subtract, multiply, bignumber, number } = math

const bn = n => bignumber(n)
const no = n => number(n)
const log = v => (console.log(v), v)
const logno = v => (console.log(no(v)), v)

/* How many pages do you want to analyze? Default: 25 */

const pages = 25

/*

Do you want to analyze Rising, New, Top or another subreddit's flairs?

To get Rising, New and Top, append /new/, etc., after the subreddit (example: /r/PoliticalCompassMemes/new/.json)

To calculate another subreddit's flairs, just change the subreddit (example: /r/PolCompMemes/.json)

If it doesn't work, make sure to test the URL on your browser.

*/

const baseUrl = 'https://www.reddit.com/r/PoliticalCompassMemes/.json'

const getPCM = (after = '') =>
	rp(baseUrl + (after ? '?after=' + after : after)).then(JSON.parse)

const numberizeFlairCounters = obj => {
	const shallowObj = Object.assign({}, obj)
	for (const flair in shallowObj) {
		for (const prop in shallowObj[flair]) {
			shallowObj[flair][prop] = no(shallowObj[flair][prop])
		}
	}
	return shallowObj
}

const mergeCounters = (counter1, counter2) => {
	const shallowCounter1 = Object.assign({}, counter1)
	const shallowCounter2 = Object.assign({}, counter2)
	for (const flair in counter2) {
		const c1 = shallowCounter1[flair]
		const c2 = shallowCounter2[flair]
		if (c1) {
			
			shallowCounter1[flair] = {
				upvotes: sum(c1.upvotes, c2.upvotes),
				downvotes: sum(c1.downvotes, c2.downvotes),
				ratio: sum(c1.ratio, c2.ratio),
				counter: sum(c1.counter, c2.counter)
			}
		} else {
			shallowCounter1[flair] = shallowCounter2[flair]
		}
	}
	return shallowCounter1
}

const countBatch = batch =>
	batch.reduce((counterObj, post) => {
		return mergeCounters(
			counterObj,
			({ [post.flair || 'Unflaired'] : {
				upvotes: post.upvotes,
				downvotes: post.downvotes,
				ratio: post.ratio,
				counter: 1
			}
		}))}, {})

async function countFlairs(i = 1, data = {}, _after) {
	const obj = await getPCM(_after)
	const { children, after } = obj.data
	const posts = children.map(post => {
		const flair = post.data.author_flair_text
		const ratio = bn(post.data.upvote_ratio)
		const score = bn(post.data.score)
		const upvotes = multiply(score, ratio)
		const downvotes = subtract(score, upvotes)
		return { flair, ratio, upvotes, downvotes }
	})
	const totals = countBatch(posts)
	if (i < pages) {
		console.log('got page ' + i)
		const finalObj = mergeCounters(data, totals)
		// console.log(numberizeFlairCounters(finalObj))
		return countFlairs(++i, finalObj, after)
	} else {
		console.log('finished on page ' + i)
		const finalObj = mergeCounters(data, totals)
		return finalObj
	}
}
const divideCurry = n2 => n1 => no(math.divide(n1, n2))

const processResults = res => {
	const shallowRes = Object.assign({}, res)
	const finalObj = {}
	for (const flair in shallowRes) {
		const obj = shallowRes[flair]
		const avg = divideCurry(obj.counter)
		finalObj[flair] = {
			upvoteAverage: avg(obj.upvotes),
			downvoteAverage: avg(obj.downvotes),
			ratioAverage: avg(obj.ratio)
		}
	}
	return finalObj
}

countFlairs().then(total => {
	const filename = 'flairCounters.json'
	console.log('Saving results to file as ' + filename)
	fs.writeFileSync(filename, JSON.stringify(processResults(total), null, 2))
})
