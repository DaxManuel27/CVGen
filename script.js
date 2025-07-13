
file = document.getElementById("fileInput")
jobDescription = document.getElementById("jobDescription")


API_KEY = "AIzaSyC6-V6__hUHj2Se7X5GqBqaj0QqoYb6uto"

function handleResumeUpload(event){
    const file = event.target.files[0]
    const reader = new FileReader()
    reader.onload = function(e){
        const resumeContent = e.target.result
    }
}
function handleJobDescription(event){
    const jobDescription = event.target.value
}
async function generateCV(event){
    const jobDesc = jobDescription
    const resume = resumeContent
    const prompt = `
    You are a helpful assistant, and a professional writer that can help me create a cover letter for a job.
    I will give you a job description and a resume.
    Please write a CV from the job description and the resume.
    
    The CV should be in the following format:
    - Name
    - Email
    - Phone
    -CV Content.
    
    ` + jobDesc + resume + `
    `
}

