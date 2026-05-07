import 'package:flutter/material.dart';

import '../theme/lawra_theme.dart';

/// Development helper: view all design pages 1..32 in a swipeable PageView.
class FlowViewer extends StatefulWidget {
  const FlowViewer({super.key, this.start = 1});

  final int start;

  @override
  State<FlowViewer> createState() => _FlowViewerState();
}

class _FlowViewerState extends State<FlowViewer> {
  late final PageController _controller;
  final int _count = 32;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: (widget.start - 1).clamp(0, 31));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Design Flow Viewer'),
        backgroundColor: LawraColors.cyan,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: _count,
        itemBuilder: (context, index) {
          final num = (index + 1).toString().padLeft(4, '0');
          return SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: Image.asset('assets/design/page-$num.png', fit: BoxFit.contain),
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Page $num', style: const TextStyle(color: LawraColors.textMuted)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
