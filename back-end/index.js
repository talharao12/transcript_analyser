const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;
require("dotenv").config();

const Groq = require("groq-sdk");
let groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_1,
});

let currentApiKeyIndex = 0;
const apiKeys = [process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2];

app.use(express.json());
app.use(cors());

const analyzeTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;

    // Checking if the transcript is provided in the request
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    // Generating the completion using the provided transcript
    const chatCompletion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content:
            "You are an analyst who will analyze transcripts of tutoring sessions and create notes to help the student study. Use your own knowledge on the topic as well.",
        },
        {
          role: "user",
          content: `Given the provided transcript of a tutoring session: "${transcript}", generate a detailed, well-structured set of notes based on the key topics discussed. 

These notes should be formatted with clear headings, subheadings, bullet points, and mathematical equations.

### Formatting Guidelines:
- **Headings**: Use bold headings for major sections (e.g., 'Introduction', 'Key Concepts').
- **Subheadings**: Use italic subheadings for subsections.
- **Bullet Points**: Use bullet points to list important concepts or steps.
- **Mathematical Equations**:
  - Use **inline LaTeX** expressions for equations within the text. Wrap these equations in single dollar signs: \`$...\`.
  - For example: "$\\frac{a}{b}$".
  - Use **block LaTeX** expressions for standalone equations. Wrap these equations in double dollar signs: \`$$...\$$\`.
  - For example:
    $$
    ax^2 + bx + c = 0
    $$

- **Examples**: Use numbered lists for sequential steps in mathematical problem-solving.

### Example of the Output:
- **Main Heading**: **Rearranging Algebraic Equations**
  
  - **Introduction**:
    Rearranging algebraic equations involves changing the subject of a formula by applying algebraic rules.

  - **Steps**:
    1. Multiply both sides by $x$:
       $$ax = b$$
    2. Move $b$ to the right-hand side.
       $$x = \\frac{b}{a}$$
  
  - **Conclusion**: Understanding how to manipulate equations is crucial in algebra.
  
Ensure all mathematical expressions are properly formatted using LaTeX and wrapped in either single ($) or double dollar signs ($$) for inline and block equations, respectively.`,
        },
      ],
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    res.json({ result: responseText });
  } catch (error) {
    console.error(error);

    // Handling API key rotation if there's a 500 error
    if (error.response && error.response.status === 500) {
      currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
      groq = new Groq({ apiKey: apiKeys[currentApiKeyIndex] });
      analyzeTranscript(req, res);
      return;
    }

    // Return other errors to the client
    res.status(500).json({ error: error.message });
  }
};

// API route to analyze transcript
app.post("/api/analyze-transcript", analyzeTranscript);

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
