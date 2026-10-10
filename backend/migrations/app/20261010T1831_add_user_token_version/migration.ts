#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4d73a84f63e4fe0affee349eedec184d43e92b9ea33aab5aa0ebbc97c542f271/contract';
import endContract from '../../snapshots/4d73a84f63e4fe0affee349eedec184d43e92b9ea33aab5aa0ebbc97c542f271/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7bf353ef2483feaab758eeae1e6069b0fa34bd1aa1ac97359ca170f1476f167b/contract';
import startContract from '../../snapshots/7bf353ef2483feaab758eeae1e6069b0fa34bd1aa1ac97359ca170f1476f167b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('tokenVersion', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
