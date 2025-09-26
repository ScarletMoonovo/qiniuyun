package llm

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"github.com/sashabaranov/go-openai"
	"log"
	"regexp"
	"time"
)

//go:embed prompts/personality.tpl
var personalityTpl string

//go:embed prompts/initial_memory.tpl
var initialMemoryTpl string

//go:embed prompts/system_prompt.tpl
var systemPromptTpl string

//go:embed prompts/generate_opening.tpl
var generateOpening string

type personality struct {
	Traits []string `json:"traits"`
}

type initialMemory struct {
	Memories []string `json:"memories"`
}

type systemPrompt struct {
	Prompt string `json:"prompt"`
}

type Client struct {
	client *openai.Client
	model  string
}

func New(apiKey, model, baseUrl string) *Client {
	config := openai.DefaultConfig(apiKey)
	config.BaseURL = baseUrl
	cli := openai.NewClientWithConfig(config)
	return &Client{
		client: cli,
		model:  model,
	}
}

var jsonRe = regexp.MustCompile(`(?s){.*?}`)

func extractJson(s string) (string, error) {
	match := jsonRe.FindString(s)
	if len(match) == 0 {
		return "", fmt.Errorf("no json found")
	}
	return match, nil
}

func (c *Client) call(message string) (string, error) {
	client := c.client
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resp, err := client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model:       c.model,
			Temperature: 0.7,
			MaxTokens:   800,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant that must output strict JSON when instructed,without any additional text.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: message,
				},
			},
		},
	)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices from llm")
	}

	return resp.Choices[0].Message.Content, nil
}

const (
	retryTimes = 3
)

func (c *Client) GeneratePersonality(description, background string) ([]string, error) {
	prompt := fmt.Sprintf(personalityTpl, description, background)

	var result personality
	for i := 0; i < retryTimes; i++ {
		raw, err := c.call(prompt)
		if err != nil {
			continue
		}
		raw, err = extractJson(raw)
		if err != nil {
			continue
		}
		if json.Unmarshal([]byte(raw), &result) == nil {
			return result.Traits, nil
		}
	}
	return nil, fmt.Errorf("failed to generate personality after retries")
}

func (c *Client) GenerateInitialMemory(background string) ([]string, error) {
	prompt := fmt.Sprintf(initialMemoryTpl, background)

	var result initialMemory
	for i := 0; i < retryTimes; i++ {
		raw, err := c.call(prompt)
		if err != nil {
			continue
		}
		raw, err = extractJson(raw)
		if err != nil {
			continue
		}
		if json.Unmarshal([]byte(raw), &result) == nil {
			return result.Memories, nil
		}
	}
	return nil, fmt.Errorf("failed to generate initial memory after retries")
}

func (c *Client) GenerateSystemPrompt(name, description string, personality []string) (string, error) {
	prompt := fmt.Sprintf(systemPromptTpl, name, description, personality)

	var result systemPrompt
	for i := 0; i < retryTimes; i++ {
		raw, err := c.call(prompt)
		if err != nil {
			continue
		}
		raw, err = extractJson(raw)
		if err != nil {
			continue
		}
		if json.Unmarshal([]byte(raw), &result) == nil {
			return result.Prompt, nil
		}
	}
	return "", fmt.Errorf("failed to generate system prompt after retries")
}

func (c *Client) GetStream(history []openai.ChatCompletionMessage) (*openai.ChatCompletionStream, error) {
	ctx := context.Background()
	stream, err := c.client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model:    openai.GPT4oMini,
		Messages: history,
		Stream:   true,
	})
	if err != nil {
		log.Println("openai stream error:", err)
		return nil, err
	}
	return stream, nil
}

func (c *Client) GenerateOpening(openLine string) (string, error) {
	ctx := context.Background()
	resp, err := c.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: c.model,
		Messages: []openai.ChatCompletionMessage{
			{Role: "user", Content: fmt.Sprintf(generateOpening, openLine)},
		},
	})
	if err != nil {
		return "", err
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}
	return "", nil
}
