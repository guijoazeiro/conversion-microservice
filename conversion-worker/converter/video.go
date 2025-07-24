package converter

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
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
		return ConvertVideoToGifHighQuality(input, output)
	case "images":
		return ConvertVideoToFramesZip(input, output)
	default:
		return fmt.Errorf("formato de vídeo não suportado: %s", format)
	}
}

func ConvertVideoToGifHighQuality(input, output string) error {
	if err := exec.Command("ffmpeg", "-y", "-i", input, "-vf", "scale=480:-1:flags=lanczos,fps=15,palettegen=stats_mode=diff", "/tmp/palette.png").Run(); err != nil {
		return err
	}

	return exec.Command("ffmpeg", "-y", "-i", input, "-i", "/tmp/palette.png", "-lavfi", "scale=480:-1:flags=lanczos,fps=15,paletteuse=dither=floyd_steinberg", "-loop", "0", output).Run()
}

func ConvertVideoToFramesZip(input, outputDir string) error {
	tempDir, err := os.MkdirTemp("", "frames_*")
	if err != nil {
		return fmt.Errorf("erro ao criar pasta temporária: %v", err)
	}

	defer os.RemoveAll(tempDir)

	outputPattern := filepath.Join(tempDir, "frame_%04d.png")

	cmd := exec.Command("ffmpeg",
		"-y", "-i", input,
		"-pix_fmt", "rgb24",
		"-q:v", "1",
		outputPattern,
	)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("erro ao extrair frames: %v", err)
	}

	return createZipFromDirectory(tempDir, outputDir)
}

func createZipFromDirectory(sourceDir, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return fmt.Errorf("erro ao criar arquivo zip: %v", err)
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()
	return filepath.Walk(sourceDir, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		file, err := os.Open(filePath)
		if err != nil {
			return err
		}
		defer file.Close()

		fileName := filepath.Base(filePath)
		zipEntry, err := zipWriter.Create(fileName)
		if err != nil {
			return err
		}

		_, err = io.Copy(zipEntry, file)
		return err
	})
}
