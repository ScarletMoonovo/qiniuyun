package embedding

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
	"github.com/zeromicro/go-zero/core/logx"
	"io/ioutil"
	"net/http"
)

const (
	fieldText = "text"
)

var (
	threshold = float32(0.65)
	limit     = uint64(5)
)

// Client 用于调用 Python Embedding 服务和 Qdrant 检索
type Client struct {
	baseURL string
	qdrant  *qdrant.Client
}

// New 创建客户端
func New(baseURL string, qdrantClient *qdrant.Client) *Client {
	return &Client{
		baseURL: baseURL,
		qdrant:  qdrantClient,
	}
}

// GetEmbedding 获取文本向量
func (c *Client) GetEmbedding(text string) ([]float32, error) {
	payload := map[string]string{"text": text}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(fmt.Sprintf("%s/embed", c.baseURL), "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Vector []float32 `json:"vector"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	fmt.Println("vector len:", len(result.Vector))
	return result.Vector, nil
}

func (c *Client) InsertVectors(ctx context.Context, collection string, texts []string, vectors [][]float32) error {
	if err := c.qdrant.CreateCollection(ctx, &qdrant.CreateCollection{
		CollectionName: collection,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     384,
			Distance: qdrant.Distance_Cosine,
		}),
	}); err != nil {
		logx.Error(err)
	}

	var points []*qdrant.PointStruct
	for i, vector := range vectors {
		point := &qdrant.PointStruct{
			Id:      qdrant.NewIDUUID(uuid.New().String()),
			Vectors: qdrant.NewVectors(vector...),
			Payload: qdrant.NewValueMap(map[string]any{fieldText: texts[i]}),
		}
		points = append(points, point)
	}
	_, err := c.qdrant.Upsert(ctx, &qdrant.UpsertPoints{
		CollectionName: collection,
		Points:         points,
	})
	return err
}

func (c *Client) Search(collection string, vector []float32) ([]string, error) {
	points, err := c.qdrant.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: collection,
		Query:          qdrant.NewQuery(vector...),
		WithPayload:    qdrant.NewWithPayloadInclude(fieldText),
		ScoreThreshold: &threshold,
		Limit:          &limit,
	})
	if err != nil {
		logx.Error(err)
		return nil, err
	}
	var texts []string
	for _, point := range points {
		fmt.Println(point.Score)
		texts = append(texts, point.Payload[fieldText].GetStringValue())
	}
	fmt.Println(texts)
	return texts, nil
}
