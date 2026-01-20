"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Database,
  Calendar,
  Clock,
  RefreshCw,
  Eye,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Backup } from "../hooks/useBackups";

interface BackupManagerProps {
  backups: Backup[];
  loading: boolean;
  onRefresh: () => void;
  onCreateBackup: () => Promise<any>;
  onRestoreBackup: (backup: Backup) => Promise<void>;
  onDeleteBackup: (backup: Backup) => Promise<void>;
  onViewBackupDetails: (backup: Backup) => Promise<void>;
  restoring: boolean;
  deleting: boolean;
}

export default function BackupManager({
  backups,
  loading,
  onRefresh,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
  onViewBackupDetails,
  restoring,
  deleting,
}: BackupManagerProps) {
  return (
    <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Backups Disponibles
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-tierra-media mx-auto mb-4 animate-spin" />
            <p className="text-sm text-tierra-media">Cargando backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
            <p className="text-sm text-tierra-media mb-2">
              No hay backups disponibles
            </p>
            <p className="text-xs text-tierra-media">
              Crea un backup usando el botón "Backup Base de Datos"
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-4 bg-admin-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-lg hover:border-admin-accent-tertiary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-azul-profundo" />
                      <span className="font-semibold text-sm">{backup.id}</span>
                      {backup.filename.includes("safety_backup") && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-yellow-50"
                        >
                          Backup de Seguridad
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-tierra-media">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {backup.created_at
                            ? new Date(backup.created_at).toLocaleDateString(
                                "es-AR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{backup.size_mb} MB</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {backup.created_at
                            ? new Date(backup.created_at).toLocaleTimeString(
                                "es-AR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">
                          {backup.filename}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewBackupDetails(backup)}
                      disabled={restoring || deleting}
                      className="text-xs"
                      title="Ver detalles y descargar"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestoreBackup(backup)}
                      disabled={restoring || deleting}
                      className="text-xs"
                    >
                      <RotateCcw
                        className={`h-3 w-3 mr-1 ${restoring ? "animate-spin" : ""}`}
                      />
                      Restaurar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteBackup(backup)}
                      disabled={restoring || deleting}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
