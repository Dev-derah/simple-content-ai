

async function transcribeChunks(transcriptionService, chunkPaths) {
  let fullTranscript = "";

  for (const chunkPath of chunkPaths) {
    console.log(`📢 Transcribing chunk: ${chunkPath}`);

    try {
      const text = await transcriptionService.transcribeAudio(chunkPath);
      fullTranscript += text + " "; // Append text with spacing
    } catch (error) {
      console.error(`❌ Error transcribing ${chunkPath}:`, error);
    }
  }

  return fullTranscript.trim();
}

module.exports = transcribeChunks;
