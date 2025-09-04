package converter

import (
	"context"
	"fmt"
	"os/exec"
)

type ImageConverter struct {
	BaseConverter
}

func (c *ImageConverter) SupportedFormats() []string {
	return []string{"png", "jpeg", "jpg", "webp", "gif", "bmp"}
}

func (c *ImageConverter) Convert(ctx context.Context, input, format, output string) error {
	if err := c.validatePaths(input, output); err != nil {
		return err
	}

	var cmd *exec.Cmd

	switch format {
	case "png", "jpeg", "jpg", "webp", "gif", "bmp":
		cmd = exec.CommandContext(ctx, "ffmpeg", "-y", "-i", input, output)
	default:
		return fmt.Errorf("unsupported image format: %s", format)
	}

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg conversion failed: %w", err)
	}

	return nil
}
