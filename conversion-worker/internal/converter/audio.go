package converter

import (
	"context"
	"fmt"
	"os/exec"
)

type AudioConverter struct {
	BaseConverter
}

func (c *AudioConverter) SupportedFormats() []string {
	return []string{"mp3", "wav", "flac", "ogg", "wma", "aac"}
}

func (c *AudioConverter) Convert(ctx context.Context, input, format, output string) error {
	if err := c.validatePaths(input, output); err != nil {
		return err
	}

	var cmd *exec.Cmd

	switch format {
	case "mp3":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-vn", "-acodec", "libmp3lame", output)
	case "wav":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, output)
	case "flac":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-vn", "-acodec", "flac", output)
	case "ogg":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-vn", "-acodec", "libvorbis", output)
	case "wma":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-vn", "-acodec", "wmav2", output)
	case "aac":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, "-vn", "-acodec", "aac", output)
	default:
		return fmt.Errorf("unsupported audio format: %s", format)
	}

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg conversion failed: %w", err)
	}

	return nil
}
