# Visemas da Ísis (15 poses + piscar + 2 expressões)

Todas as imagens PNG têm as mesmas dimensões e enquadramento de
`../isis-avatar.png` (1024×1024, rosto e corpo na mesma posição — só a boca,
os olhos ou as sobrancelhas mudam).

## Bocas (15)

| Ficheiro | Pose da boca | Sons |
|---|---|---|
| `rest.png` | fechada, em repouso | silêncio, pausas (opcional: usa-se `isis-avatar.png`) |
| `mbp.png` | lábios fechados e premidos | m, b, p |
| `fv.png` | dentes de cima no lábio de baixo | f, v |
| `a.png` | aberta, grande | a tónico |
| `e.png` | meio aberta, esticada | e, é, ê, c, k, q, g |
| `i.png` | esticada, ponta da língua nos dentes de cima | i, t, d, n, l |
| `sz.png` | esticada, dentes juntos | s, z, ç |
| `o.png` | arredondada, média | o, ô |
| `oa.png` | arredondada, bem aberta | ó |
| `u.png` | arredondada, pequena e projetada | u, o átono (pt-PT) |
| `schwa.png` | quase fechada, lábios entreabertos | e e a átonos (pt-PT) |
| `chj.png` | lábios projectados, dentes visíveis | ch, j, x |
| `r.png` | entreaberta, língua levantada | r, rr |
| `ao.png` | arredondada, dentes visíveis | ã, õ, ão, ou |
| `lhnh.png` | língua contra o palato/dentes | lh, nh |

## Olhos e expressões (3)

| Ficheiro | O que é | Quando aparece |
|---|---|---|
| `blink.png` | **PNG transparente** só com as pálpebras fechadas (o resto do ficheiro transparente), para se sobrepor a qualquer boca | piscar de 130 ms, a cada 3–6 s, também a falar |
| `expr-smile.png` | imagem completa: sorriso e sobrancelhas relaxadas | 2,5 s depois de a Ísis acabar de falar |
| `expr-thinking.png` | imagem completa: sobrancelhas levantadas, olhar pensativo, boca fechada | enquanto espera a resposta do tutor |

## Fallbacks (nada é obrigatório)

Uma imagem em falta nunca parte nada. Ordem: imagem própria → visema "pai"
(`sz`→`i`, `oa`→`o`, `schwa`→`e`, `u`→`o`) → `isis-avatar.png` (fechada) ou
`isis-avatar-mouth-open.png` (aberta). Sem `blink.png`/`expr-*.png`, o piscar e
as expressões simplesmente não aparecem.

Mapeamento texto → visema (inclui a redução de vogais átonas do português
europeu): `components/ai-tutor/visemes.ts`.
