import { check } from 'k6'
import http from 'k6/http'
import imported_options from './workload_options.js'
import crypto from 'k6/crypto'

export let options = imported_options

function randomIntBetween(min, max) { // min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Copied from https://stackoverflow.com/a/55200387
const byteToHex = [];

for (let n = 0; n <= 0xff; ++n)
{
	const hexOctet = n.toString(16).padStart(2, '0');
	byteToHex.push(hexOctet);
}

function hex(arrayBuffer)
{
	const buff = new Uint8Array(arrayBuffer);
	const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

	for (let i = 0; i < buff.length; ++i)
		hexOctets.push(byteToHex[buff[i]]);

	return hexOctets.join('');
}

function getXrayTraceHeader() {
	// https://docs.aws.amazon.com/xray/latest/devguide/xray-services-apigateway.html
	// 96-bit identifier
	const trace_id = crypto.hexEncode(crypto.randomBytes(12))
	const current_time_secs = Math.floor(Date.now() / 1000)

	let ab = new ArrayBuffer(4)
	let dv = new DataView(ab)
	dv.setInt32(0, current_time_secs)
	const current_time_hex = hex(ab)

	return `Root=1-${current_time_hex}-${trace_id}`
}

// Init stage.
const ew_url = __ENV.EVENT_WRITER_URL
const pc_url = __ENV.PRODUCT_CATALOG_URL
const pr_url = __ENV.PHOTO_RECEIVE_URL
const image_data = open(__ENV.IMAGE_FILE)

const vu_states = {}

const actions = [
	{
		name: "RegisterPhotographer",
		weight: 0.1,
		run: (state, xray_header) => {
			const photo_id = String(randomIntBetween(1000000000, 9999999999))
			const res = registerPhotographer(`photographer-${photo_id}`, photo_id, xray_header);
//			console.log(JSON.stringify(res))
			check(res, {
				'status is 200': (res) => res.status === 200,
			})
			// if (res.status != 200) console.log(JSON.stringify(res))

			state.photographers[photo_id] = true
		},
	},
	{
		name: "NewProduct",
		weight: 0.1,
		run: (state, xray_header) => {
			const id = String(randomIntBetween(1000000, 9999999))
			const cat_id = String(randomIntBetween(1, 6))
			const cat = `category-${cat_id}`
			const res = newProduct(id, cat, `name${id}`, `brand-${id}`, `description-${id}`, xray_header);
//			console.log(JSON.stringify(res))
			check(res, {
				'status is 200': (res) => res.status === 200,
			})
			// if (res.status != 200) console.log(JSON.stringify(res))

			state.products[id] = true
			state.categories[cat_id] = true
		},
	},
	{
		name: "ListCategories",
		weight: 0.3,
		run: (state, xray_header) => {
			const res = listCategories(xray_header)
			// console.log(JSON.stringify(res))
			check(res, {
				'status is 200': (res) => res.status === 200,
			})
			// if (res.status != 200) console.log(JSON.stringify(res))
		}
	},
	{
		name: "ListProductsByCategory",
		weight: 0.3,
		run: (state, xray_header) => {
			const allCategories = Object.keys(state.categories)
			const cat_id = allCategories[randomIntBetween(0, allCategories.length)]
			const cat = `category-${cat_id}`
			const res = listProductsByCategory(cat, xray_header)
			// console.log(JSON.stringify(res))
			check(res, {
				'status is 200': (res) => res.status === 200,
			})
			// if (res.status != 200) console.log(JSON.stringify(res))
		}
	},
	{
		name: "ListProductsByID",
		weight: 0.1,
		run: (state, xray_header) => {
			const allProducts = Object.keys(state.products)
			const id = allProducts[randomIntBetween(0, allProducts.length)]
			const res = listProductsByID(id, xray_header)
//			console.log(JSON.stringify(res))
			check(res, {
				'status is 200': (res) => res.status === 200,
			})
			// if (res.status != 200) console.log(JSON.stringify(res))
		}

	},
	{
		name: "CommitPhoto",
		weight: 0.1,
		run: (state, xray_header) => {
			const allProducts = Object.keys(state.products)
			const id = allProducts[randomIntBetween(0, allProducts.length)]
			const allPhotographers = Object.keys(state.photographers)
			const photo_id = allPhotographers[randomIntBetween(0, allPhotographers.length)]
			const res = commitPhoto(`photographer-${photo_id}`, photo_id, id, image_data, xray_header)
//			console.log(JSON.stringify(res))
			check(res, {
				'status is 200': (res) => res.status === 200,
			})
			// if (res.status != 200) console.log(JSON.stringify(res))
		}

	}
]

export default function() {
	const state = vu_states[__VU] || { products: {}, categories: {}, photographers: {} }
//	console.log(`vu ${__VU}: ` + JSON.stringify(state))

	// Normalize the action weights
	const actions_total_weight = actions.map(x => x.weight).reduce((acc, weight) => acc + weight)

	// Select an action while accounting for weights
	let threshold = Math.random();
	const randomIndex = Math.floor(threshold * actions.length);
	const action = actions.find(candidate => {
		if (threshold < candidate.weight) {
			return true;
		}
		threshold -= candidate.weight;
		return false;
	}) || actions[randomIndex];
	// const action = actions[5]
	// console.log(`[vu ${__VU}] Action: ${action.name}`)

	const xray_header = getXrayTraceHeader()

	// Run action and persist the modified state
	action.run(state, xray_header)
	vu_states[__VU] = state
}

function registerPhotographer(pg_id, phone_number, xray_header) {
	const data = {
		'schema': 'com.nordstrom/user-info/update-phone/1-0-0',
		'id': pg_id,
		'phone': phone_number,  // random 10-digit number
		'origin': 'hello-retail/sb-register-photographer/dummy_id/dummy_name',
	}
	return http.request("POST", `${ew_url}/event-writer`, JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

function newProduct(prod_id, prod_category, prod_name, prod_brand, prod_desc, xray_header) {
	const data = {
		'schema': 'com.nordstrom/product/create/1-0-0',
		'id': prod_id,
		'origin': 'hello-retail/sb-create-product/dummy_id/dummy_name',
		'category': prod_category.trim(),
		'name': prod_name.trim(),
		'brand': prod_brand.trim(),
		'description': prod_desc.trim(),
	}
	return http.request("POST", `${ew_url}/event-writer`, JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

function listCategories(xray_header) {
	return http.request("GET", `${pc_url}/categories`)
}

function listProductsByCategory(category, xray_header) {
	return http.request("GET", `${pc_url}/products?category=${category}`)  // category needs to be URI encoded!
}

function listProductsByID(product_id, xray_header) {
	return http.request("GET", `${pc_url}/products?id=${product_id}`)
}

function commitPhoto(pg_id, phone_number, item_id, image, xray_header) {
	const data = {
		'photographer': {
			'id': pg_id,
			'phone': phone_number
		},
		'For': item_id,
		'Media': image  // base64 encoded file
	}
	return http.request("POST", `${pr_url}/sms`, JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

