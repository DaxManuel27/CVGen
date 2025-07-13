const express = require("express")
const cors = require("cors")
const path = require("path")
require('dotenv').config()
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.static('static'))

// Add debugging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Content-Length: ${req.get('Content-Length')} bytes`)
    next()
})

async function callGeminiAPI(apiKey, prompt){
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const requestBody = {
        contents: [{
            parts: [{ text: prompt}]
        }],
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048
        }
    }
    try{
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody)
        })
        const data = await response.json()
        return data.candidates[0].content.parts[0].text
    }catch(error){
        console.error('Error calling Gemini API:', error)
        throw error
    }
}

function createPrompt(jobDescription, resume) {
    return `
    First, extract this information from the resume:
    - Name: [extract name]
    - Email: [extract email]  
    - LinkedIn: [extract LinkedIn]
    - GitHub: [extract GitHub]
    
    Then write a cover letter using this extracted information.
    
    Resume: ${resume}
    Job Description: ${jobDescription}
    `;
}

app.post('/api/generate', async (req, res) => {
    try{
        const { jobDescription, resume } = req.body
        const apiKey = process.env.GEMINI_API_KEY
        
        if(!jobDescription || !resume){
            return res.status(400).json({error: 'Missing required fields'})
        }
        
        if(!apiKey){
            return res.status(500).json({error: 'API key not configured'})
        }
        
        const prompt = createPrompt(jobDescription, resume)
        const cv = await callGeminiAPI(apiKey, prompt)
        res.json({cv})
    }catch(error){
        console.error('Error generating CV:', error)
        res.status(500).json({error: 'Failed to generate CV'})
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})