document.getElementById('uploader').addEventListener('change', function() {
    const file = this.files[0];
    const fileNameDisplay = document.getElementById('fileName');
    if (file) {
        fileNameDisplay.textContent = `選択されたファイル: ${file.name}`;
    } else {
        fileNameDisplay.textContent = '';
    }
});

document.getElementById('convert').addEventListener('click', async () => {
    const uploader = document.getElementById('uploader');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    if (uploader.files.length === 0) {
        errorMessage.textContent = "ファイルを選択してください！";
        errorMessage.style.display = 'block';
        return;
    }

    const file = uploader.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const result = await convertToMP3(new Uint8Array(e.target.result));
            const mp3Blob = new Blob([result], { type: 'audio/mpeg' });
            const mp3Url = URL.createObjectURL(mp3Blob);

            const downloadLink = document.getElementById('downloadLink');
            downloadLink.href = mp3Url;
            downloadLink.download = `${file.name.split('.')[0]}.mp3`;
            downloadLink.style.display = 'block';
            downloadLink.textContent = "Download MP3";
        } catch (error) {
            errorMessage.textContent = `変換中にエラーが発生しました: ${error.message}`;
            errorMessage.style.display = 'block';
        }
    };

    reader.readAsArrayBuffer(file);
});

function convertToMP3(inputData) {
    return new Promise((resolve, reject) => {
        var ffmpeg = new Worker('./ffmpeg-worker-mp4.js');
        
        ffmpeg.onmessage = function(e) {
            var msg = e.data;
            switch (msg.type) {
                case "done":
                    resolve(msg.data.MEMFS[0].data);
                    break;
                case "error":
                    reject(new Error(msg.data));
                    break;
            }
        };

        ffmpeg.postMessage({
            type: "run",
            MEMFS: [{name: "input.wav", data: inputData}],
            arguments: ["-i", "input.wav", "output.mp3"],
        });
    });
}
