import {callServerFunction} from "./serverService";

export async function startSitemap(projectId) {
    console.log('Start Sitemap', projectId)
    if (!projectId) return
    try {
        const data = {projectId}
        const res = await callServerFunction('startSitemap', data)
        // res should contain { ok:true, runId } ideally
        alert('Sitemap generation started')
    } catch (err) {
        console.error(err)
        alert('Failed to start sitemap: ' + err.message)
    }
}

export async function startPageCollection(projectId) {
    console.log('Start Page Collection', projectId)
    if (!projectId) return
    try {
        const data = {projectId}
        const res = await callServerFunction('startPageCollection', data)
        // res should contain { ok:true, runId } ideally
        alert('Sitemap generation started')
    } catch (err) {
        console.error(err)
        alert('Failed to start sitemap: ' + err.message)
    }
}

export async function startFullScan(projectId) {
    if (!projectId) return
    try {
        const payload = {projectId, type: 'full_scan'}
        const res = await callServerFunction('startScan', payload)
        alert('Full scan started')
    } catch (err) {
        console.error(err)
        alert('Failed to start scan: ' + err.message)
    }
}

export  async function scanSinglePage(projectId, page) {
    if (!projectId || !page) return
    try {
        await callServerFunction('scanPage', {projectId, pagesIds: [page.id]})
        alert('Page scan queued')
    } catch (err) {
        console.error(err)
        alert('Failed to scan page: ' + err.message)
    }
}