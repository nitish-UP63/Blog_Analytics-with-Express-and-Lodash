const express = require('express');
const app = express();
const axios = require('axios');
const _ = require('lodash');

const PORT = 5000;

//blog-stats
async function fetchAnalyticsData() {
    console.log('Fetching analytics data...');
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
        headers: {
            'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
        }
    });
    const blogData = response.data.blogs;

    const totalBlogs = blogData.length;
    const longestTitleBLog = _.maxBy(blogData, 'title.length');
    const blogsWithPrivacy = _.filter(blogData, blog => /privacy/i.test(blog.title));
    const blogsWithPrivacyCount = _.size(blogsWithPrivacy);
    const uniqueBlogTitles = _.unionBy(blogData, 'title').map(blog => blog.title);

    return {
        totalBlogs: totalBlogs,
        longestBlogTitle: longestTitleBLog.title,
        blogsWithPrivacyCount: blogsWithPrivacyCount,
        uniqueBlogTitles: uniqueBlogTitles,
    };
}

const memoizedFetchAnalyticsData = _.memoize(fetchAnalyticsData, undefined, 100000);

//blog search
async function searchData(query) {
    console.log(`Searching data for query: ${query}`);
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
        headers: {
            'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
        }
    });

    const blogData = response.data.blogs;
    const lowerCaseQuery = query.toLowerCase();
    const searchResult = blogData.filter(blog => _.toLower(blog.title).includes(lowerCaseQuery));

    return searchResult;
}

const memoizedSearchData = _.memoize(searchData, undefined, 1000);

// blog-stats
app.get('/api/blog-stats', async (req, res) => {
    try {
        const analyticsResult = await memoizedFetchAnalyticsData();
        res.json(analyticsResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//blog search
app.get('/api/blog-search', async (req, res) => {
    try {
        const query = req.query.query;
        const searchResult = await memoizedSearchData(query);
        res.json(searchResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is runninng on port ${PORT}`);
});