package converter

import (
	"fmt"
	"os/exec"
)

type ImageConverter struct{}

func (c *ImageConverter) Convert(input, format, output string) error {
	switch format {
	case "png", "jpeg", "jpg", "webp":
		return exec.Command("ffmpeg", "-y", "-i", input, output).Run()
	default:
		return fmt.Errorf("formato de imagem não suportado: %s", format)
	}
}
