
# ollama_client.py
import requests
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"

def generate_content(layout, topic):
    """
    Generate slide content using Ollama based on layout and topic
    """
    prompts = {
        "titleAndBullets": f"Create a slide with a title and 3-5 bullet points about '{topic}'. Format as JSON with 'title' and 'bullets' (array).",
        "quote": f"Create an inspirational quote about '{topic}'. Format as JSON with 'quote' and 'author'.",
        "imageAndParagraph": f"Create a slide about '{topic}' with an image description and a paragraph. Format as JSON with 'title', 'imageDescription', and 'paragraph'.",
        "twoColumn": f"Create a slide about '{topic}' with two columns of information. Format as JSON with 'title', 'column1Title', 'column1Content', 'column2Title', 'column2Content'.",
        "titleOnly": f"Create a compelling title slide about '{topic}'. Format as JSON with 'title' and 'subtitle'."
    }
    
    prompt = prompts.get(layout)
    
    try:
        # Send request to Ollama
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": "llama3.1:8b",  # or whatever model you have installed
                "prompt": prompt,
                "stream": False
            }
        )
        
        if response.status_code == 200:
            # Extract the JSON content from the response
            result = response.json()
            generated_text = result.get("response", "")
            
            # Try to parse the JSON output from the LLM
            try:
                # Find the JSON part in the response
                json_start = generated_text.find('{')
                json_end = generated_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = generated_text[json_start:json_end]
                    return json.loads(json_str)
                else:
                    # Fallback: structure the content manually
                    return format_content_fallback(layout, generated_text, topic)
            except json.JSONDecodeError:
                return format_content_fallback(layout, generated_text, topic)
        else:
            return {"error": f"Ollama API error: {response.status_code}"}
    except Exception as e:
        return {"error": f"Error connecting to Ollama: {str(e)}"}

def format_content_fallback(layout, text, topic):
    """Fallback formatting if JSON parsing fails"""
    if layout == "titleAndBullets":
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        title = lines[0] if lines else f"About {topic}"
        bullets = []
        for line in lines[1:5]:
            # Remove bullet markers if present
            if line.startswith('- '):
                bullets.append(line[2:])
            elif line.startswith('* '):
                bullets.append(line[2:])
            else:
                bullets.append(line)
        return {"title": title, "bullets": bullets}
    
    elif layout == "quote":
        parts = text.split(' - ')
        quote = parts[0].strip('"')
        author = parts[1] if len(parts) > 1 else "Unknown"
        return {"quote": quote, "author": author}
    
    elif layout == "imageAndParagraph":
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        title = lines[0] if lines else f"About {topic}"
        paragraph = " ".join(lines[1:])
        return {
            "title": title,
            "imageDescription": f"An image about {topic}",
            "paragraph": paragraph
        }
    
    elif layout == "twoColumn":
        return {
            "title": f"About {topic}",
            "column1Title": "Overview",
            "column1Content": "First part of the content",
            "column2Title": "Details",
            "column2Content": "Second part of the content"
        }
    
    elif layout == "titleOnly":
        return {
            "title": f"{topic.capitalize()} Presentation",
            "subtitle": "An overview of key concepts"
        }
    
    return {"error": "Could not format content"}