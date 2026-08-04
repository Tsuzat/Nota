package db

import (
	"context"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
)

// RecordAiUsage updates user balance, inserts log, and keeps latest 50 within a single transaction.
func RecordAiUsage(ctx context.Context, user *models.User, noteId string, inputTokens, outputTokens, totalCostCents int, description string) error {
	tx, err := config.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Update user balance
	_, err = tx.NewUpdate().
		Model((*models.User)(nil)).
		Set("ai_credits = GREATEST(0, ai_credits - ?)", totalCostCents).
		Where("id = ?", user.Id).
		Exec(ctx)
	if err != nil {
		return err
	}

	// 2. Insert log
	log := &models.AiUsageLog{
		UserId:       user.Id,
		NoteId:       noteId,
		InputTokens:  inputTokens,
		OutputTokens: outputTokens,
		CostCents:    totalCostCents,
		Description:  description,
	}
	_, err = tx.NewInsert().Model(log).Exec(ctx)
	if err != nil {
		return err
	}

	// 3. Prune old logs for user (keep 50)
	// Delete where id NOT IN (top 50 ids for this user)
	subq := tx.NewSelect().
		Model((*models.AiUsageLog)(nil)).
		Column("id").
		Where("user_id = ?", user.Id).
		OrderExpr("created_at DESC").
		Limit(50)

	_, err = tx.NewDelete().
		Model((*models.AiUsageLog)(nil)).
		Where("user_id = ?", user.Id).
		Where("id NOT IN (?)", subq).
		Exec(ctx)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func GetAiUsageLogs(ctx context.Context, userId string, limit int) ([]models.AiUsageLogResponse, error) {
	logs := make([]models.AiUsageLogResponse, 0)

	err := config.DB.NewSelect().
		Model((*models.AiUsageLog)(nil)).
		ModelTableExpr("ai_usage_logs AS l").
		ColumnExpr("l.id, l.cost_cents, l.note_id, n.name AS note_name, l.description, l.created_at").
		Join("LEFT JOIN notes AS n ON n.id = l.note_id").
		Where("l.user_id = ?", userId).
		OrderExpr("l.created_at DESC").
		Limit(limit).
		Scan(ctx, &logs)

	return logs, err
}
