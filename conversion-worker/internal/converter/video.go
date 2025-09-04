package converter

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
)

type VideoConverter struct {
	BaseConverter
}

func (c *VideoConverter) SupportedFormats() []string {
	return []string{"mp4", "avi", "mkv", "mp3", "wav", "mov", "flv", "wmv", "gif", "images"}
}

func (c *VideoConverter) Convert(ctx context.Context, input, format, output string) error {
	if err := c.validatePaths(input, output); err != nil {
		return err
	}

	var cmd *exec.Cmd

	switch format {
	case "mp4":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "mp4", output)
	case "avi":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "avi", output)
	case "mkv":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "matroska", output)
	case "mp3":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-vn", "-acodec", "libmp3lame", output)
	case "wav":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, output)
	case "mov":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "mov", output)
	case "flv":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "flv", output)
	case "wmv":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-c:v", "libx264", "-f", "wmv", output)
	case "gif":
		return c.convertToGIF(ctx, input, output)
	case "images":
		return c.convertToFrames(ctx, input, output)
	default:
		return fmt.Errorf("unsupported video format: %s", format)
	}

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg conversion failed: %w", err)
	}

	return nil
}

func (c *VideoConverter) convertToGIF(ctx context.Context, input, output string) error {
	paletteCmd := exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input,
		"-vf", "scale=480:-1:flags=lanczos,fps=15,palettegen=stats_mode=diff",
		"/tmp/palette.png")

	if err := paletteCmd.Run(); err != nil {
		return fmt.Errorf("failed to generate palette: %w", err)
	}

	gifCmd := exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-i", "/tmp/palette.png",
		"-lavfi", "scale=480:-1:flags=lanczos,fps=15,paletteuse=dither=floyd_steinberg",
		"-loop", "0", output)

	if err := gifCmd.Run(); err != nil {
		return fmt.Errorf("failed to generate GIF: %w", err)
	}

	return nil
}

func (c *VideoConverter) convertToFrames(ctx context.Context, input, output string) error {
	tempDir, err := os.MkdirTemp("", "frames_*")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

	outputPattern := filepath.Join(tempDir, "frame_%04d.png")
	cmd := exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input,
		"-pix_fmt", "rgb24", "-q:v", "1", outputPattern)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to extract frames: %w", err)
	}

	return c.createZIP(tempDir, output)
}

func (c *VideoConverter) createZIP(sourceDir, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return fmt.Errorf("failed to create ZIP file: %w", err)
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
