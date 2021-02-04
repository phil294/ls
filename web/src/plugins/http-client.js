import axios from 'axios'

export default {
	beforeCreate({ error, store }, inject) {
		const http_client = axios.create({
			baseURL: process.env.VUE_APP_API_ROOT
		})

		http_client.interceptors.request.use(config => {
			store.dispatch('server_reachable')
			const token = store.state.session.token
			if(token)
				config.headers.Authorization = `Bearer ${token}`
			/* TODO: Remove setting error_content and its references once https://github.com/axios/axios/issues/2387 is fixed: */
			// @ts-ignore
			// config.error_context = new Error("Thrown at:")
			return config
		})

		http_client.interceptors.response.use((response => response), (axios_error) => {
			const resp = axios_error.response;
			if (resp) {
				let data = resp.data || resp.statusText || 'unknown error message';
				const http_query_url = axios_error.config.url;
				if(typeof data == 'object')
					data.http_query_url = http_query_url;
				else
					data += ` for request ${http_query_url}`
				// Can use this for better stack trace:
				// axios_error.config?.error_context?.stack
				return error(data, resp.status)
			} else {
				return error({ status: 0 }, 0)
			}
		})

		inject('http', http_client)
	},
}
