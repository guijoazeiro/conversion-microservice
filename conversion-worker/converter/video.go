package converter

import (
	"fmt"
	"os/exec"
)

type VideoConverter struct{}

func (c *VideoConverter) Convert(input, format, output string) error {
	switch format {
	case "mp4":
		return exec.Command("ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "mp4", output).Run()
	case "avi":
		return exec.Command("ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "avi", output).Run()
	case "mkv":
		return exec.Command("ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "matroska", output).Run()
	case "mp3":
		return exec.Command("ffmpeg", "-y", "-i", input, "-vn", "-acodec", "libmp3lame", output).Run()
	case "wav":
		return exec.Command("ffmpeg", "-y", "-i", input, output).Run()
	case "mov":
		return exec.Command("ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "mov", output).Run()
	case "flv":
		return exec.Command("ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "flv", output).Run()
	case "wmv":
		return exec.Command("ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "wmv", output).Run()
	case "gif":
		return exec.Command("ffmpeg", "-y", "-i", input, "-vf", "scale=480:-1:flags=lanczos,fps=15", "-f", "gif", "-loop", "0", output).Run()
	default:
		return fmt.Errorf("formato de vídeo não suportado: %s", format)
	}
}
