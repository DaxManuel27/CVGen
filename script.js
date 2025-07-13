
let resumeContent = '';
let jobDescriptionText = '';
let generatedCV = '';

async function handleResumeUpload() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    
    if (!file) {
        alert("Please select a file first");
        return;
    }
    
    try {
        if (file.type === 'application/pdf') {
            resumeContent = await extractTextFromPDF(file);
        } else if (file.type === 'text/plain') {
            resumeContent = await readTextFile(file);
        } else {
            alert("Unsupported file type. Please upload a PDF or TXT file.");
            return;
        }
        
        // Validate content
        if (!resumeContent || resumeContent.trim().length < 10) {
            alert("Could not extract readable content from the file. Please try a different format.");
            return;
        }
        
        alert("Resume uploaded successfully");
    } catch (error) {
        alert("Error reading file: " + error.message);
    }
}

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                let textContent = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textData = await page.getTextContent();
                    const pageText = textData.items.map(item => item.str).join(' ');
                    textContent += pageText + '\n';
                }
                
                resolve(textContent);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function generateCV() {
    const jobDescInput = document.getElementById("jobDescription");
    jobDescriptionText = jobDescInput.value.trim();
    
    // Validate inputs
    if (!resumeContent) {
        alert("Please upload your resume first");
        return;
    }
    
    if (!jobDescriptionText) {
        alert("Please enter a job description");
        return;
    }
    
    // Show loading state
    const cvOutput = document.getElementById("cvOutput");
    const cvContent = document.getElementById("cvContent");
    cvOutput.style.display = "block";
    cvContent.innerHTML = '<div class="loading">Generating your cover letter...</div>';
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobDescription: jobDescriptionText,
                resume: resumeContent
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            generatedCV = data.cv;
            cvContent.innerHTML = `<pre>${data.cv}</pre>`;
        } else {
            cvContent.innerHTML = `<div style="color: #e74c3c;">Error: ${data.error}</div>`;
        }
    } catch (error) {
        cvContent.innerHTML = `<div style="color: #e74c3c;">Network error: ${error.message}</div>`;
    }
}

function downloadCV() {
    if (!generatedCV) {
        alert("No CV to download");
        return;
    }
    
    try {
        // Try to download as PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // PDF formatting options
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const maxLineWidth = pageWidth - (margin * 2);
        
        // Fixed formatting options
        const fontSize = 12;
        const fontFamily = "times";
        const lineHeight = 6;
        
        // Font settings
        doc.setFont(fontFamily, "normal");
        doc.setFontSize(fontSize);
        
        // Split text into lines that fit within the page width
        const lines = doc.splitTextToSize(generatedCV, maxLineWidth);
        
        // Add text to PDF with proper line spacing
        let yPosition = margin;
        
        for (let i = 0; i < lines.length; i++) {
            // Check if we need a new page
            if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            
            doc.text(lines[i], margin, yPosition);
            yPosition += lineHeight;
        }
        
        doc.save('cover_letter.pdf');
    } catch (error) {
        // Fallback to text download if jsPDF fails
        console.error('PDF download failed, falling back to text:', error);
        const blob = new Blob([generatedCV], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cover_letter.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}