function getScraperStatus(taskId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${URL_API}/get_status/${taskId}`,
            type: 'POST',
            success: response => {
                resolve(response.state);
            },
            error: err => {
                reject(err);
            }
        });
    });
}

function startScraping() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${URL_API}/start`,
            type: 'POST',
            success: response => {
                resolve(response.task_id);
            },
            error: err => {
                reject(err);
            }
        });
    });
}