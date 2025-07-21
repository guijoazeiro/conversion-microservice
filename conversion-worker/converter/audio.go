package converter

import (
	"fmt"
	"os/exec"
)

type AudioConverter struct{}

func (c *AudioConverter) Convert(input, format, output string) error {
	switch format {
	case "mp3":
		return exec.Command("ffmpeg", "-y", "-i", input, "-vn", "-acodec", "libmp3lame", output).Run()
	case "wav":
		return exec.Command("ffmpeg", "-y", "-i", input, output).Run()
	default:
		return fmt.Errorf("formato de áudio não suportado: %s", format)
	}
}
