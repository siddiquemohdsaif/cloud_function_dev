// async function uploadGamePlayLink(uid, link) {
//     try {
//         const videoId = extractVideoId(link);
//         console.log("Video ID:", videoId);
//         // Continue with your logic, for example, uploading the videoId to your server
//     } catch (error) {
//         console.error("Error extracting video ID:", error.message, link);
//     }
// }

// async function extractVideoId(url) {
//     try {
//         const parsedUrl = new URL(url);
//         const videoId = parsedUrl.searchParams.get("v");
//         if (videoId) {
//             return videoId;
//         } else {
//             throw new Error("Unable to extract video ID from URL: "+ url);
//         }
//     } catch (error) {
//         throw new Error("Invalid URL :" + url);
//     }
// }
// // Example usage:
// //uploadGamePlayLink('some-uid', 'https://www.youtube.com/watch?v=ZoId_-DT8AQ');
// uploadGamePlayLink('some-uid', 'https://youtu.be/WIPrN6VTP48?si=7oUB740pjfVE8WxG');



async function uploadGamePlayLink(uid, link) {
    try {
        const videoId = extractVideoId(link);
        console.log("Video ID:", videoId);
        // Continue with your logic, for example, uploading the videoId to your server
    } catch (error) {
        console.error("Error extracting video ID:", error.message, link);
    }
}

function extractVideoId(url) {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname === 'youtu.be') {
            // Handle short URLs like https://youtu.be/WIPrN6VTP48
            return parsedUrl.pathname.slice(1);
        } else if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
            // Handle full URLs like https://www.youtube.com/watch?v=ZoId_-DT8AQ
            const videoId = parsedUrl.searchParams.get("v");
            if (videoId) {
                return videoId;
            }
            // Handle URLs like https://www.youtube.com/v/ZoId_-DT8AQ and https://www.youtube.com/embed/ZoId_-DT8AQ
            const pathMatch = parsedUrl.pathname.match(/^\/(v|embed)\/([^/?&]+)/);
            if (pathMatch && pathMatch[2]) {
                return pathMatch[2];
            }
        }
        throw new Error("Unable to extract video ID from URL");
    } catch (error) {
        throw new Error("Invalid URL");
    }
}

// Example usage:
uploadGamePlayLink('some-uid', 'https://www.youtube.com/watch?v=ZoId_-DT8AQ');
uploadGamePlayLink('some-uid', 'https://youtu.be/WIPrN6VTP48?si=7oUB740pjfVE8WxG');
uploadGamePlayLink('some-uid', 'https://www.youtube.com/v/ZoId_-DT8AQ');
uploadGamePlayLink('some-uid', 'https://www.youtube.com/embed/ZoId_-DT8AQ');
uploadGamePlayLink('some-uid', 'https://www.youtube.com/watch?v=ZoId_-DT8AQ&feature=youtu.be');
