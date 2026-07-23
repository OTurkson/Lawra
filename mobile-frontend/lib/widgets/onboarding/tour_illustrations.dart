import 'package:flutter/material.dart';

import '../../theme/lawra_theme.dart';

/// Decorative pill bars used behind several tour illustrations.
class _TourBackdrop extends StatelessWidget {
  const _TourBackdrop({required this.bars});

  final List<_BarSpec> bars;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (final bar in bars)
              Positioned(
                left: bar.left * constraints.maxWidth,
                top: bar.top * constraints.maxHeight,
                child: Transform.rotate(
                  angle: bar.angle,
                  child: Container(
                    width: bar.width,
                    height: bar.height,
                    decoration: BoxDecoration(
                      color: bar.color,
                      borderRadius: BorderRadius.circular(bar.height / 2),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _BarSpec {
  const _BarSpec({
    required this.left,
    required this.top,
    required this.width,
    required this.height,
    required this.color,
    this.angle = 0,
  });

  final double left;
  final double top;
  final double width;
  final double height;
  final Color color;
  final double angle;
}

class ModerateRatesIllustration extends StatelessWidget {
  const ModerateRatesIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        const _TourBackdrop(
          bars: [
            _BarSpec(left: -0.05, top: 0.05, width: 220, height: 28, color: Color(0xFFB8E8E0)),
            _BarSpec(left: 0.15, top: 0.18, width: 180, height: 24, color: Color(0xFFCDEFE8)),
            _BarSpec(left: -0.1, top: 0.32, width: 260, height: 30, color: Color(0xFFA8DDD4)),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _CoinStack(coins: 3, stackHeight: 56),
              const SizedBox(width: 10),
              _CoinStack(coins: 4, stackHeight: 72),
              const SizedBox(width: 10),
              _CoinStack(coins: 5, stackHeight: 88),
              const SizedBox(width: 10),
              _CoinStack(coins: 6, stackHeight: 104),
            ],
          ),
        ),
        Positioned(
          right: 24,
          bottom: 72,
          child: Icon(Icons.eco, color: LawraColors.green.withValues(alpha: 0.7), size: 28),
        ),
      ],
    );
  }
}

class _CoinStack extends StatelessWidget {
  const _CoinStack({required this.coins, required this.stackHeight});

  final int coins;
  final double stackHeight;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: stackHeight,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFE8C547),
              border: Border.all(color: const Color(0xFFD4AF37), width: 2),
            ),
            alignment: Alignment.center,
            child: const Text('¢', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF8B6914))),
          ),
          for (var i = 0; i < coins; i++)
            Container(
              margin: const EdgeInsets.only(top: 2),
              width: 34,
              height: 10,
              decoration: BoxDecoration(
                color: const Color(0xFFE8C547),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFD4AF37)),
              ),
            ),
        ],
      ),
    );
  }
}

class StressFreeIllustration extends StatelessWidget {
  const StressFreeIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        const _TourBackdrop(
          bars: [
            _BarSpec(left: -0.2, top: 0.08, width: 280, height: 32, color: Color(0xFFCDEFD8), angle: -0.35),
            _BarSpec(left: 0.05, top: 0.22, width: 240, height: 28, color: Color(0xFFB8E8E0), angle: -0.35),
            _BarSpec(left: -0.05, top: 0.38, width: 300, height: 34, color: Color(0xFFA5DFD0), angle: -0.35),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Container(
            width: 120,
            height: 210,
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 12, offset: const Offset(0, 6))],
            ),
            padding: const EdgeInsets.all(10),
            child: Column(
              children: [
                Container(
                  height: 56,
                  decoration: BoxDecoration(color: const Color(0xFFB0BEC5), borderRadius: BorderRadius.circular(6)),
                ),
                const SizedBox(height: 8),
                Container(height: 8, color: const Color(0xFFCFD8DC)),
                const SizedBox(height: 6),
                Container(height: 8, width: 70, color: const Color(0xFFCFD8DC)),
                const Spacer(),
                Row(
                  children: [
                    Expanded(child: Container(height: 36, color: const Color(0xFFB0BEC5))),
                    const SizedBox(width: 6),
                    Expanded(child: Container(height: 36, color: const Color(0xFFB0BEC5))),
                  ],
                ),
              ],
            ),
          ),
        ),
        Positioned(
          left: 48,
          bottom: 8,
          child: _stickFigure(shirt: const Color(0xFFFF7043), pants: LawraColors.cyan),
        ),
      ],
    );
  }
}

class FastFlexibleIllustration extends StatelessWidget {
  const FastFlexibleIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        const _TourBackdrop(
          bars: [
            _BarSpec(left: -0.15, top: 0.1, width: 260, height: 30, color: Color(0xFFCDEFD8), angle: -0.4),
            _BarSpec(left: 0.1, top: 0.28, width: 220, height: 26, color: Color(0xFFB8E8E0), angle: -0.4),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Icon(Icons.air, color: Colors.orange.withValues(alpha: 0.5), size: 48),
              _stickFigure(shirt: const Color(0xFFFF7043), pants: const Color(0xFF42A5F5), running: true),
              Icon(Icons.speed, color: LawraColors.cyan.withValues(alpha: 0.5), size: 40),
            ],
          ),
        ),
        Positioned(
          bottom: 4,
          child: Container(
            width: 100,
            height: 12,
            decoration: BoxDecoration(
              color: Colors.grey.shade400,
              borderRadius: BorderRadius.circular(50),
            ),
          ),
        ),
      ],
    );
  }
}

class SecureReliableIllustration extends StatelessWidget {
  const SecureReliableIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        const _TourBackdrop(
          bars: [
            _BarSpec(left: -0.08, top: 0.12, width: 240, height: 26, color: Color(0xFFCDEFD8)),
            _BarSpec(left: 0.12, top: 0.28, width: 200, height: 22, color: Color(0xFFB8E8E0)),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_rounded, size: 88, color: const Color(0xFF1A237E)),
              const SizedBox(height: 8),
              _stickFigure(shirt: const Color(0xFFFF7043), pants: const Color(0xFF42A5F5), seated: true),
            ],
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            height: 8,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [LawraColors.green, LawraColors.cyan]),
            ),
          ),
        ),
      ],
    );
  }
}

Widget _stickFigure({
  required Color shirt,
  required Color pants,
  bool running = false,
  bool seated = false,
}) {
  return SizedBox(
    width: running ? 72 : 64,
    height: running ? 100 : seated ? 80 : 90,
    child: CustomPaint(
      painter: _FigurePainter(shirt: shirt, pants: pants, running: running, seated: seated),
    ),
  );
}

class _FigurePainter extends CustomPainter {
  _FigurePainter({
    required this.shirt,
    required this.pants,
    required this.running,
    required this.seated,
  });

  final Color shirt;
  final Color pants;
  final bool running;
  final bool seated;

  @override
  void paint(Canvas canvas, Size size) {
    final head = Paint()..color = const Color(0xFF5D4037);
    final body = Paint()..color = shirt;
    final legs = Paint()..color = pants;
    final stroke = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    canvas.drawCircle(Offset(size.width / 2, 14), 12, head);
    final bodyRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(size.width / 2, seated ? 42 : 44), width: 28, height: seated ? 26 : 32),
      const Radius.circular(6),
    );
    canvas.drawRRect(bodyRect, body);

    if (seated) {
      canvas.drawLine(Offset(size.width / 2 - 8, 54), Offset(size.width / 2 - 22, 68), legs);
      canvas.drawLine(Offset(size.width / 2 + 8, 54), Offset(size.width / 2 + 22, 68), legs);
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(size.width / 2 - 18, 48, 36, 22), const Radius.circular(4)),
        Paint()..color = const Color(0xFF90CAF9),
      );
    } else if (running) {
      canvas.drawLine(Offset(size.width / 2, 58), Offset(size.width / 2 - 16, 88), legs..strokeWidth = 5);
      canvas.drawLine(Offset(size.width / 2, 58), Offset(size.width / 2 + 18, 82), legs);
      canvas.drawLine(Offset(size.width / 2 - 4, 48), Offset(size.width / 2 - 22, 38), stroke);
      canvas.drawLine(Offset(size.width / 2 + 4, 48), Offset(size.width / 2 + 24, 52), stroke);
    } else {
      canvas.drawLine(Offset(size.width / 2 - 6, 58), Offset(size.width / 2 - 6, 82), legs..strokeWidth = 5);
      canvas.drawLine(Offset(size.width / 2 + 6, 58), Offset(size.width / 2 + 6, 82), legs);
      canvas.drawLine(Offset(size.width / 2 - 8, 46), Offset(size.width / 2 - 8, 28), stroke);
      canvas.drawLine(Offset(size.width / 2 + 8, 46), Offset(size.width / 2 + 8, 22), stroke);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
